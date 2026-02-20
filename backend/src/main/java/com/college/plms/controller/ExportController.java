package com.college.plms.controller;

import com.college.plms.model.Project;
import com.college.plms.model.User;
import com.college.plms.repository.ProjectRepository;
import com.college.plms.service.PdfExportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/export")
public class ExportController {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private PdfExportService pdfExportService;

    @GetMapping("/projects")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY')")
    public ResponseEntity<byte[]> exportProjects() {
        List<Project> projects = projectRepository.findAll();
        
        StringBuilder csv = new StringBuilder();
        csv.append("ID,Title,Domain,Stage,Status,Student,Faculty,Team Members,Deadline,Created At\n");
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        
        for (Project p : projects) {
            String teamMembers = p.getTeamMembers().stream()
                    .map(User::getFullName)
                    .collect(Collectors.joining("; "));
            
            csv.append(p.getId()).append(",")
               .append(escapeCsv(p.getTitle())).append(",")
               .append(escapeCsv(p.getDomain())).append(",")
               .append(p.getStage()).append(",")
               .append(p.getStatus()).append(",")
               .append(escapeCsv(p.getStudent().getFullName())).append(",")
               .append(escapeCsv(p.getFaculty() != null ? p.getFaculty().getFullName() : "N/A")).append(",")
               .append(escapeCsv(teamMembers)).append(",")
               .append(p.getStageDeadline() != null ? p.getStageDeadline().format(formatter) : "N/A").append(",")
               .append(p.getCreatedAt().format(formatter)).append("\n");
        }
        
        byte[] content = csv.toString().getBytes();
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=projects_export.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(content);
    }

    @GetMapping("/projects/{id}/pdf")
    @PreAuthorize("hasAnyRole('ADMIN', 'FACULTY', 'STUDENT')")
    public ResponseEntity<?> exportProjectPdf(@org.springframework.web.bind.annotation.PathVariable Long id) {
        try {
            Project project = projectRepository.findById(id).orElseThrow();
            byte[] pdfData = pdfExportService.generateProjectReport(project);
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=project_report_" + id + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfData);
        } catch (Exception e) {
             e.printStackTrace();
             return ResponseEntity.badRequest().body("Failed to generate PDF: " + e.getMessage());
        }
    }
    
    private String escapeCsv(String data) {
        if (data == null) return "N/A";
        String escapedData = data.replaceAll("\"", "\"\"");
        if (escapedData.contains(",") || escapedData.contains("\n") || escapedData.contains("\"")) {
            escapedData = "\"" + escapedData + "\"";
        }
        return escapedData;
    }
}
